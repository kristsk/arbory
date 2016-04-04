<?php

namespace CubeSystems\Leaf\Fields;

use Closure;
use CubeSystems\Leaf\Http\Controllers\AdminController;
use CubeSystems\Leaf\Results\Row;
use CubeSystems\Leaf\FieldSet;
use Illuminate\Database\Eloquent\Model;
use Illuminate\View\View;

/**
 * Class AbstractField
 * @package CubeSystems\Leaf\Fields
 */
abstract class AbstractField implements FieldInterface
{
    const CONTEXT_LIST = 'list';
    const CONTEXT_FORM = 'form';

    /**
     * @var string
     */
    protected $name;

    /**
     * @var mixed
     */
    protected $value;

    /**
     * @var Row
     */
    protected $row;

    /**
     * @var string
     */
    protected $label;

    /**
     * @var string
     */
    protected $context;

    /**
     * @var Closure
     */
    protected $before;

    /**
     * @var Closure
     */
    protected $after;

    /**
     * @var FieldSet
     */
    protected $fieldSet;

    /**
     * @var Closure
     */
    protected $saveWith;

    /**
     * @var Model
     */
    protected $model;

    /**
     * @var AdminController
     */
    protected $controller;

    /**
     * AbstractField constructor.
     * @param string $name
     */
    public function __construct( $name )
    {
        $this->setName( $name );
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param string $name
     * @return $this
     */
    public function setName( $name )
    {
        $this->name = $name;

        return $this;
    }

    /**
     * @return mixed
     */
    public function getValue()
    {
        return $this->value;
    }

    /**
     * @param string $value
     * @return $this
     */
    public function setValue( $value )
    {
        $this->value = $value;

        return $this;
    }

    /**
     * @return Row
     */
    public function getRow()
    {
        return $this->row;
    }

    /**
     * @param Row $row
     * @return $this
     */
    public function setRow( Row $row )
    {
        $this->row = $row;

        return $this;
    }

    /**
     * @return string
     */
    public function getContext()
    {
        return $this->context;
    }

    /**
     * @param string $context
     * @return $this
     */
    public function setContext( $context )
    {
        $this->context = $context;

        return $this;
    }

    /**
     * @return $this
     */
    public function setListContext()
    {
        $this->context = self::CONTEXT_LIST;

        return $this;
    }

    /**
     * @return $this
     */
    public function setFormContext()
    {
        $this->context = self::CONTEXT_FORM;

        return $this;
    }

    /**
     * @return string
     */
    public function getLabel()
    {
        if( $this->label === null )
        {
            return $this->name;
        }

        return $this->label;
    }

    /**
     * @param string $label
     * @return $this
     */
    public function setLabel( $label )
    {
        $this->label = $label;

        return $this;
    }

    /**
     * @return string
     */
    public function getViewName()
    {
        return 'leaf::builder.fields.' . snake_case( class_basename( static::class ) );
    }

    /**
     * @return bool
     */
    public function isForForm()
    {
        return $this->getContext() === self::CONTEXT_FORM;
    }

    /**
     * @return bool
     */
    public function isForList()
    {
        return $this->getContext() === self::CONTEXT_LIST;
    }

    /**
     * @return Closure
     */
    public function getBefore()
    {
        return $this->before;
    }

    /**
     * @param $before
     * @return $this
     */
    public function setBefore( $before )
    {
        $this->before = $before;

        return $this;
    }

    /**
     * @return bool
     */
    public function hasBefore()
    {
        return $this->before !== null;
    }

    /**
     * @return FieldSet
     */
    public function getFieldSet()
    {
        return $this->fieldSet;
    }

    /**
     * @param FieldSet $fieldSet
     * @return $this
     */
    public function setFieldSet( FieldSet $fieldSet )
    {
        $this->fieldSet = $fieldSet;

        return $this;
    }

    /**
     * @return Closure
     */
    public function getSaveWith()
    {
        return $this->saveWith;
    }

    /**
     * @param Closure $handler
     * @return $this
     */
    public function setSaveWith( Closure $handler )
    {
        $this->saveWith = $handler;

        return $this;
    }

    /**
     * @return bool
     */
    public function hasSaveWith()
    {
        return $this->saveWith !== null;
    }

    /**
     * @return Model
     */
    public function getModel()
    {
        return $this->model;
    }

    /**
     * @param Model $model
     * @return $this
     */
    public function setModel( $model )
    {
        $this->model = $model;

        return $this;
    }

    /**
     * @return AdminController
     */
    public function getController()
    {
        return $this->controller;
    }

    /**
     * @param AdminController $controller
     * @return $this
     */
    public function setController( $controller )
    {
        $this->controller = $controller;

        return $this;
    }

    /**
     * @param Model $model
     * @param array $input
     * @return null
     */
    public function postUpdate( Model $model, array $input = [] )
    {
        return null;
    }

    /**
     * @return bool
     */
    public function isSearchable()
    {
        return true;
    }

    /**
     * @return bool
     */
    public function isSortable()
    {
        return true;
    }





    /**
     * TODO: Move to trait
     */

    protected $inputNamespace;

    public function getInputName()
    {
        $nameParts = preg_split( '/\./', $this->inputNamespace, NULL, PREG_SPLIT_NO_EMPTY );
        $nameParts[] = $this->getName();

        return 'resource[' . implode( '][', $nameParts ) . ']';
    }

    public function getInputId()
    {
        return strtr( $this->getInputName(), [ '[' => '_', ']' => '' ] );
    }

    public function getInputNamespace()
    {
        return $this->inputNamespace;
    }

    public function setInputNamespace( $namespace )
    {
        $this->inputNamespace = $namespace;

        return $this;
    }

    /**
     * @return View
     */
    abstract public function render();

}
